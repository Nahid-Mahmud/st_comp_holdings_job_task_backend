import { Router } from 'express';

import { platformFeeRouter } from '../modules/platformFee/platformFee.route';

export const router: Router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRoute[] = [
  {
    path: '/platform-fees',
    route: platformFeeRouter,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
