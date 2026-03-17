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
        // roles: ['admin'],
        permissions: ['stats:read:all:get:stats.dashboard']
    },
    {
        id: 'clients',
        title: 'Clientes',
        type: 'basic',
        icon: 'heroicons_outline:user-group',
        link: '/clients',
        // roles: ['admin'],
        permissions: ['users:read:all:get:users']
    },
    {
        id: 'stores',
        title: 'Tiendas',
        type: 'basic',
        icon: 'heroicons_outline:building-office',
        link: '/stores',
        // roles: ['admin'],
        permissions: ['stores:read:store:get:stores']
    },
    {
        id: 'rbac',
        title: 'Roles y Permisos',
        type: 'basic',
        icon: 'heroicons_outline:shield-check',
        link: '/rbac',
        permissions: ['admin:read:all:get:admin.rbac.roles']
        // roles: ['admin']
    },
    // {
    //     id: 'clients-store',
    //     title: 'Clientes',
    //     type: 'basic',
    //     icon: 'heroicons_outline:user-group',
    //     link: '/clients-store',
    //     roles: ['agent'],
    //     permissions: ['agents:read:own:get:agents.me.users']
    // }
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
