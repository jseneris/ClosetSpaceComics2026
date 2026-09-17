import { Router, Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { BadRequestError } from '../errors/bad-request-error';

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
