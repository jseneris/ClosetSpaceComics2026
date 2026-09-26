import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prismaClient';
import { BadRequestError } from '../errors/bad-request-error';
import { blobStorageService } from '../services/blobStorageService';

const router = Router();

// GET /api/catalog/issues?date=YYYY-MM-DD
// Ported from CatalogController.SearchByDate: returns issues released in the
// following 7 days, plus the distinct publisher filter list.
router.get('/issues', async (req: Request, res: Response) => {
  const { date, title } = req.query as { date?: string; title?: string };

  if (title) {
    const issues = await prisma.issue.findMany({
      where: { title: { name: { contains: title } } },
      include: { title: { include: { publisher: true } } },
      take: 100,
    });
    return res.send(serializeIssues(issues));
  }

  if (!date) {
    throw new BadRequestError('date or title query parameter is required');
  }

  const startDate = new Date(date);
  if (Number.isNaN(startDate.getTime())) {
    throw new BadRequestError('bad date string');
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  const issues = await prisma.issue.findMany({
    where: { releaseDate: { gte: startDate, lt: endDate } },
    include: { title: { include: { publisher: true } } },
  });

  return res.send(serializeIssues(issues));
});

// GET /api/catalog/publishers
router.get('/publishers', async (_req: Request, res: Response) => {
  const publishers = await prisma.publisher.findMany({ orderBy: { displayOrder: 'asc' } });
  return res.send(publishers);
});

// GET /api/catalog/purchases — public purchases for the public frontend.
router.get('/purchases', async (_req: Request, res: Response) => {
  const purchases = await prisma.purchase.findMany({
    where: { userId: 1 },
    orderBy: [{ purchaseDate: 'desc' }, { id: 'desc' }],
    select: { id: true, description: true, purchaseDate: true },
  });

  return res.send({
    Purchases: purchases.map((purchase) => ({
      Id: purchase.id,
      Description: purchase.description,
      PurchaseDate: purchase.purchaseDate,
    })),
  });
});

// GET /api/catalog/collection/filters — public filters for user 1's collection.
// Aggregation runs in SQL against the ActivePurchaseItems view instead of pulling rows into Node.
router.get('/collection/filters', async (req: Request, res: Response) => {
  const title = String(req.query.title ?? '').trim();
  const publisher = String(req.query.publisher ?? '').trim();
  const titleFilter = title ? Prisma.sql`AND t.name LIKE ${`%${title}%`}` : Prisma.empty;
  const publisherFilter = publisher ? Prisma.sql`AND p.name = ${publisher}` : Prisma.empty;

  const [publisherRows, yearRows] = await Promise.all([
    prisma.$queryRaw<Array<{ name: string; purchaseItemCount: number }>>(Prisma.sql`
      SELECT p.name AS name, COUNT(api.id) AS purchaseItemCount
      FROM Publishers p
      JOIN Titles t ON t.publisherId = p.id
      JOIN ActivePurchaseItems api ON api.titleId = t.id AND api.userId = 1
      WHERE 1 = 1 ${titleFilter} ${publisherFilter}
      GROUP BY p.name
      ORDER BY COUNT(api.id) DESC, p.name ASC
    `),
    prisma.$queryRaw<Array<{ year: number }>>(Prisma.sql`
      SELECT DISTINCT YEAR(i.releaseDate) AS year
      FROM Issues i
      JOIN Titles t ON t.id = i.titleId
      JOIN Publishers p ON p.id = t.publisherId
      JOIN ActivePurchaseItems api ON api.issueId = i.id AND api.userId = 1
      WHERE i.releaseDate IS NOT NULL ${titleFilter} ${publisherFilter}
      ORDER BY year DESC
    `),
  ]);

  return res.send({
    Publishers: publisherRows.map((row) => row.name),
    Years: yearRows.map((row) => row.year),
  });
});

// GET /api/catalog/collection/title-suggestions?q=bat
// Ranking (by purchase item quantity) runs in SQL against the ActivePurchaseItems view.
router.get('/collection/title-suggestions', async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim();
  if (query.length < 2) {
    return res.send({ Titles: [] });
  }

  const rows = await prisma.$queryRaw<Array<{ name: string; seoFriendlyName: string | null }>>(Prisma.sql`
    SELECT TOP 10 t.name AS name, t.seoFriendlyName AS seoFriendlyName
    FROM Titles t
    JOIN ActivePurchaseItems api ON api.titleId = t.id AND api.userId = 1
    WHERE t.name LIKE ${`%${query}%`}
    GROUP BY t.name, t.seoFriendlyName
    ORDER BY COUNT(api.id) DESC, t.name ASC
  `);

  return res.send({
    Titles: rows.map((row) => ({ Name: row.name, SeoFriendlyName: row.seoFriendlyName })),
  });
});

// GET /api/catalog/collection — public issue collection for user 1.
router.get('/collection', async (req: Request, res: Response) => {
  const pageSize = 40;
  const requestedPage = Number(req.query.page ?? 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const title = String(req.query.title ?? '').trim();
  const publisher = String(req.query.publisher ?? '').trim();
  const requestedYear = Number(req.query.year);
  const year = Number.isInteger(requestedYear) ? requestedYear : undefined;
  const releaseDate = year
    ? { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) }
    : undefined;

  // Resolve matching issue ids via the indexed ActivePurchaseItems view instead of the
  // slow correlated some/none relation filter, which was scanning the whole collection
  // whenever title/publisher/year weren't narrowing the search (e.g. "Clear filters").
  const titleFilter = title ? Prisma.sql`AND t.name LIKE ${`%${title}%`}` : Prisma.empty;
  const publisherFilter = publisher ? Prisma.sql`AND p.name = ${publisher}` : Prisma.empty;
  const releaseDateFilter = releaseDate
    ? Prisma.sql`AND i.releaseDate >= ${releaseDate.gte} AND i.releaseDate < ${releaseDate.lt}`
    : Prisma.empty;

  const matchingPage = await prisma.$queryRaw<Array<{ id: number; total: number }>>(Prisma.sql`
    WITH Matches AS (
      SELECT DISTINCT i.id AS id, t.name AS titleName, i.issueNumberOrdinal AS issueNumberOrdinal
      FROM Issues i
      JOIN Titles t ON t.id = i.titleId
      JOIN Publishers p ON p.id = t.publisherId
      JOIN ActivePurchaseItems api ON api.issueId = i.id AND api.userId = 1
      WHERE 1 = 1 ${titleFilter} ${publisherFilter} ${releaseDateFilter}
    )
    SELECT id, CAST(COUNT(*) OVER() AS INT) AS total
    FROM Matches
    ORDER BY titleName ASC, issueNumberOrdinal ASC, id ASC
    OFFSET ${(page - 1) * pageSize} ROWS FETCH NEXT ${pageSize} ROWS ONLY
  `);
  const total = matchingPage[0]?.total ?? 0;
  const pageIds = matchingPage.map((row) => row.id);

  const items = await prisma.issue.findMany({
    where: { id: { in: pageIds } },
    orderBy: [{ title: { name: 'asc' } }, { issueNumberOrdinal: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      seoFriendlyName: true,
      imageUrl: true,
      issueNumberOrdinal: true,
      description: true,
      coverPrice: true,
      title: {
        select: {
          name: true,
          seoFriendlyName: true,
          publisher: { select: { name: true, seoFriendlyName: true } },
        },
      },
      purchaseItems: {
        where: { purchase: { userId: 1 } },
        orderBy: { id: 'desc' },
        take: 1,
        select: {
          photos: {
            orderBy: { id: 'asc' },
            take: 1,
            select: { name: true },
          },
        },
      },
    },
  });

  return res.send({
    Page: page,
    PageSize: pageSize,
    TotalIssues: total,
    HasMore: page * pageSize < total,
    Books: items.map((item) => ({
      Id: item.id,
      IssueSeoFriendlyName: item.seoFriendlyName,
      ImageUrl: item.purchaseItems[0]?.photos[0]
        ? blobStorageService.getImageUrl(
            `${item.title.publisher.seoFriendlyName}/${item.title.seoFriendlyName}/${
              item.purchaseItems[0].photos[0].name
            }${item.purchaseItems[0].photos[0].name.toLowerCase().endsWith('.jpg') ? '' : '.jpg'}`
          )
        : null,
      IssueNum: String(item.issueNumberOrdinal),
      Title: item.title.name,
      Publisher: item.title.publisher.name,
      Description: item.description,
      CoverPrice: item.coverPrice,
    })),
  });
});

function serializeIssues(
  issues: Array<{
    id: number;
    imageUrl: string | null;
    issueNumberOrdinal: number;
    description: string | null;
    coverPrice: unknown;
    title: { name: string; publisher: { name: string; imageName: string | null } };
  }>
) {
  const filterMap = new Map<string, string | null>();
  const mappedIssues = issues.map((issue) => {
    filterMap.set(issue.title.publisher.name, issue.title.publisher.imageName);
    return {
      Id: issue.id,
      ImageUrl: issue.imageUrl,
      IssueNum: String(issue.issueNumberOrdinal),
      Title: issue.title.name,
      Publisher: issue.title.publisher.name,
      Description: issue.description,
      CoverPrice: issue.coverPrice,
    };
  });

  const filters = Array.from(filterMap.entries()).map(([name, imageName]) => ({
    Name: name,
    ImageUrl: imageName ?? null,
  }));

  return { Issues: mappedIssues, Filters: filters };
}

export { router as catalogRouter };
