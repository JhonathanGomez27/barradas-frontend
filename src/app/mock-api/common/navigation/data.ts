/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    // {
    //     id   : 'example',
    //     title: 'Example',
    //     type : 'basic',
    //     icon : 'heroicons_outline:chart-pie',
    //     link : '/example'
    // },
    {
        id: 'statistics',
        title: 'Estadísticas',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/statistics',
        roles: ['admin']
    },
    {
        id: 'clients',
        title: 'Clientes',
        type: 'basic',
        icon: 'heroicons_outline:user-group',
        link: '/clients',
        roles: ['admin']
    },
    {
        id: 'stores',
        title: 'Tiendas',
        type: 'basic',
        icon: 'heroicons_outline:building-office',
        link: '/stores',
        roles: ['admin']
    },
    {
        id: 'rbac',
        title: 'Roles y Permisos',
        type: 'basic',
        icon: 'heroicons_outline:shield-check',
        link: '/rbac',
        roles: ['admin']
    },
    {
        id: 'clients-store',
        title: 'Clientes',
        type: 'basic',
        icon: 'heroicons_outline:user-group',
        link: '/clients-store',
        roles: ['agent']
    }
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example'
    }
];
