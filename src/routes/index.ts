import { Router } from 'express';

import { platformFeeRouter } from '../modules/platformFee/platformFee.route';
import { serviceOfferingsMasterListRouter } from '../modules/serviceOfferingsMasterList/serviceOfferingsMasterList.route';

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
  {
    path: '/service-offerings-master-list',
    route: serviceOfferingsMasterListRouter,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
