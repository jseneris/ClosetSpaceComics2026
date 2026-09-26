import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { requireAuth, attachCurrentUser } from '../middlewares/auth';
import { BadRequestError } from '../errors/bad-request-error';

const router = Router();

// Every route below requires a valid Auth0 access token; attachCurrentUser
// resolves req.currentUserId from the token's `sub` claim.
router.use(requireAuth, attachCurrentUser);

// GET /api/user/collection — ported from UserController.GetCollection
router.get('/collection', async (req: Request, res: Response) => {
  const locations = await prisma.location.findMany({
    where: { userId: req.currentUserId },
    include: {
      boxes: {
        include: { _count: { select: { items: true } } },
      },
    },
    orderBy: { order: 'asc' },
  });

  res.send({
    Locations: locations.map((location) => ({
      Id: location.id,
      Name: location.name,
      Boxes: location.boxes.map((box) => ({
        Id: box.id,
        Name: box.name,
        ItemCount: box._count.items,
        IsVisibleInCatalog: box.isVisibleInCatalog,
      })),
    })),
  });
});

// POST /api/user/locations
router.post('/locations', async (req: Request, res: Response) => {
  const schema = z.object({ name: z.string().min(1) });
  const { name } = schema.parse(req.body);

  const location = await prisma.location.create({
    data: { name, userId: req.currentUserId!, order: 0 },
  });

  res.send({ Id: location.id, Name: location.name, Boxes: [] });
});

// POST /api/user/locations/:locationId/boxes
router.post('/locations/:locationId/boxes', async (req: Request, res: Response) => {
  const schema = z.object({ name: z.string().min(1) });
  const { name } = schema.parse(req.body);
  const locationId = Number(req.params.locationId);

  const location = await prisma.location.findFirst({
    where: { id: locationId, userId: req.currentUserId },
  });
  if (!location) {
    throw new BadRequestError('location not found');
  }

  const box = await prisma.box.create({ data: { name, locationId, order: 0 } });
  res.send({ Id: box.id, Name: box.name });
});

// PATCH /api/user/boxes/:boxId/visibility — toggle whether a box's contents show on the public catalog.
router.patch('/boxes/:boxId/visibility', async (req: Request, res: Response) => {
  const schema = z.object({ isVisibleInCatalog: z.boolean() });
  const { isVisibleInCatalog } = schema.parse(req.body);
  const boxId = Number(req.params.boxId);

  const box = await prisma.box.findFirst({
    where: { id: boxId, location: { userId: req.currentUserId } },
  });
  if (!box) {
    throw new BadRequestError('box not found');
  }

  const updated = await prisma.box.update({
    where: { id: boxId },
    data: { isVisibleInCatalog },
  });

  res.send({ Id: updated.id, Name: updated.name, IsVisibleInCatalog: updated.isVisibleInCatalog });
});

// GET /api/user/collection/location/:locationId/box/:boxId — ported from UserController.GetBox
router.get(
  '/collection/location/:locationId/box/:boxId',
  async (req: Request, res: Response) => {
    const locationId = Number(req.params.locationId);
    const boxId = Number(req.params.boxId);

    const box = await prisma.box.findFirst({
      where: { id: boxId, locationId, location: { userId: req.currentUserId } },
      include: {
        items: {
          include: { issue: true },
          orderBy: [{ issue: { title: { name: 'asc' } } }, { issue: { issueNumberOrdinal: 'asc' } }],
        },
      },
    });
    if (!box) {
      throw new BadRequestError('box not found');
    }

    res.send(
      box.items.map((item) => ({
        Id: item.id,
        ImageUrl: item.issue?.imageUrl ?? null,
      }))
    );
  }
);

// GET /api/user/purchases?page=1 — ported from UserController.GetPurchases
router.get('/purchases', async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = 20;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId: req.currentUserId },
      orderBy: { purchaseDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.purchase.count({ where: { userId: req.currentUserId } }),
  ]);

  res.send({
    TotalPages: Math.ceil(total / pageSize),
    Purchases: purchases.map((purchase) => ({
      Id: purchase.id,
      Description: purchase.description,
      PurchaseDate: purchase.purchaseDate,
      Price: purchase.price,
    })),
  });
});

// GET /api/user/latest-purchase-books
router.get('/latest-purchase-books', async (_req: Request, res: Response) => {
  const purchase = await prisma.purchase.findFirst({
    where: { userId: 1 },
    orderBy: [{ purchaseDate: 'desc' }, { id: 'desc' }],
    include: {
      items: {
        where: { issueId: { not: null } },
        orderBy: { id: 'desc' },
        take: 5,
        include: {
          issue: { include: { title: { include: { publisher: true } } } },
        },
      },
    },
  });

  res.send({
    Books: (purchase?.items ?? []).map((item) => ({
      Id: item.issue!.id,
      ImageUrl: item.issue!.imageUrl,
      IssueNum: String(item.issue!.issueNumberOrdinal),
      Title: item.issue!.title.name,
      Publisher: item.issue!.title.publisher.name,
      Description: item.issue!.description,
      CoverPrice: item.issue!.coverPrice,
    })),
  });
});

// POST /api/user/purchases — ported from UserController.CreateNewPurchase
router.post('/purchases', async (req: Request, res: Response) => {
  const schema = z.object({
    Description: z.string().min(1),
    PurchaseDate: z.string(),
    Price: z.string(),
  });
  const model = schema.parse(req.body);

  const purchaseDate = new Date(model.PurchaseDate);
  if (Number.isNaN(purchaseDate.getTime())) {
    throw new BadRequestError('purchase date required.');
  }

  const price = Number(model.Price.replace('$', ''));
  if (Number.isNaN(price)) {
    throw new BadRequestError('price required.');
  }

  const purchase = await prisma.purchase.create({
    data: {
      description: model.Description,
      purchaseDate,
      price,
      userId: req.currentUserId!,
    },
  });

  res.send({ Id: purchase.id });
});

// POST /api/user/purchase/:id/:issueId — ported from UserController.AddBookToPurchase
router.post('/purchase/:id/:issueId', async (req: Request, res: Response) => {
  const purchaseId = Number(req.params.id);
  const issueId = Number(req.params.issueId);

  const purchase = await prisma.purchase.findFirst({
    where: { id: purchaseId, userId: req.currentUserId },
  });
  if (!purchase) {
    throw new BadRequestError('purchase not found');
  }

  const item = await prisma.purchaseItem.create({
    data: { purchaseId, issueId, condition: 0, order: 0 },
  });

  res.send({ Id: item.id });
});

// GET /api/user/collectiontitles — ported from UserController.CollectionTitles
router.get('/collectiontitles', async (req: Request, res: Response) => {
  const items = await prisma.purchaseItem.findMany({
    where: { purchase: { userId: req.currentUserId }, titleId: { not: null } },
    include: { title: true },
    distinct: ['titleId'],
  });

  res.send(items.map((item) => item.title?.name).filter(Boolean));
});

// GET /api/user/collectionbytitle?name=... — ported from UserController.CollectionByTitle
router.get('/collectionbytitle', async (req: Request, res: Response) => {
  const name = String(req.query.name ?? '');
  if (!name) {
    throw new BadRequestError('name is required');
  }

  const items = await prisma.purchaseItem.findMany({
    where: { purchase: { userId: req.currentUserId }, title: { name } },
    include: { issue: true },
  });

  res.send(
    items.map((item) => ({
      Id: item.id,
      ImageUrl: item.issue?.imageUrl ?? null,
    }))
  );
});

export { router as userRouter };
