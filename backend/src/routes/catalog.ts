import { Router, Request, Response } from 'express';
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
router.get('/collection/filters', async (_req: Request, res: Response) => {
  const purchasedIssue = {
    some: { purchase: { userId: 1 } },
    none: {
      purchase: { userId: 1 },
      box: { location: { name: 'Sold' } },
    },
  };
  const issues = await prisma.issue.findMany({
    where: { purchaseItems: purchasedIssue },
    select: {
      releaseDate: true,
      title: { select: { publisher: { select: { name: true } } } },
    },
  });
  const publishers = Array.from(new Set(issues.map((issue) => issue.title.publisher.name))).sort();
  const years = Array.from(
    new Set(issues.flatMap((issue) => (issue.releaseDate ? [issue.releaseDate.getUTCFullYear()] : [])))
  ).sort((left, right) => right - left);

  return res.send({
    Publishers: publishers,
    Years: years,
  });
});

// GET /api/catalog/collection/title-suggestions?q=bat
router.get('/collection/title-suggestions', async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim();
  if (query.length < 2) {
    return res.send({ Titles: [] });
  }

  const titles = await prisma.title.findMany({
    where: { name: { contains: query } },
    orderBy: { name: 'asc' },
    take: 10,
    select: { name: true, seoFriendlyName: true },
  });

  return res.send({
    Titles: titles.map((title) => ({ Name: title.name, SeoFriendlyName: title.seoFriendlyName })),
  });
});

// GET /api/catalog/collection — public issue collection for user 1.
router.get('/collection', async (req: Request, res: Response) => {
  const pageSize = 20;
  const requestedPage = Number(req.query.page ?? 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const title = String(req.query.title ?? '').trim();
  const publisher = String(req.query.publisher ?? '').trim();
  const requestedYear = Number(req.query.year);
  const year = Number.isInteger(requestedYear) ? requestedYear : undefined;
  const releaseDate = year
    ? { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) }
    : undefined;
  const where = {
    title: {
      ...(title ? { name: { contains: title } } : {}),
      ...(publisher ? { publisher: { name: publisher } } : {}),
    },
    ...(releaseDate ? { releaseDate } : {}),
    purchaseItems: {
      some: { purchase: { userId: 1 } },
      none: {
        purchase: { userId: 1 },
        box: { location: { name: 'Sold' } },
      },
    },
  };

  const [items, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: [{ title: { name: 'asc' } }, { issueNumberOrdinal: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
    prisma.issue.count({ where }),
  ]);

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
