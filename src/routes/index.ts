import { Router } from 'express';

import { authRoutes } from '../modules/auth/auth.route';
import { platformFeeRouter } from '../modules/platformFee/platformFee.route';
import { serviceOfferingsMasterListRouter } from '../modules/serviceOfferingsMasterList/serviceOfferingsMasterList.route';
import { specialistsRouter } from '../modules/specialists/specialists.route';
import { userRoutes } from '../modules/user/user.route';

export const router: Router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRoute[] = [
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/platform-fees',
    route: platformFeeRouter,
  },
  {
    path: '/service-offerings-master-list',
    route: serviceOfferingsMasterListRouter,
  },
  {
    path: '/specialists',
    route: specialistsRouter,
  },
  {
    path: '/users',
    route: userRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
