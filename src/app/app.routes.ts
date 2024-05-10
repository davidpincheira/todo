import { Routes } from '@angular/router';
import { ListComponent } from './domains/products/pages/list/list.component';
import { AboutComponent } from './domains/info/about/about.component';
import { NotFoundComponent } from './domains/info/pages/not-found/not-found.component';
import { LayoutComponent } from '@shared/components/layout/layout.component';
import { ProductDetailComponent } from './domains/products/pages/product-detail/product-detail.component';
import { authGuard } from '@shared/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', redirectTo: 'products', pathMatch: 'full' },
            {
                path: 'products',
                //component: ListComponent
                loadComponent: () => import("./domains/products/pages/list/list.component").then(m => m.ListComponent),
                canActivate: [authGuard]
            },
/*             {
                path: 'about',
                //component: AboutComponent
                loadComponent: () => import("./domains/info/about/about.component").then(m => m.AboutComponent)
            }, */
            {
                path: 'product/:id',
                //component: ProductDetailComponent
                loadComponent: () => import("./domains/products/pages/product-detail/product-detail.component").then(m => m.ProductDetailComponent),
                canActivate: [authGuard]
            },
            {
                path: 'checkout',
                //component: ProductDetailComponent
                loadComponent: () => import("./domains/shared/components/checkout/checkout.component").then(m => m.CheckoutComponent),
                canActivate: [authGuard]
            },
            {
                path: 'login',
                //component: ProductDetailComponent
                loadComponent: () => import("./domains/shared/components/login/login.component").then(m => m.LoginComponent)
            },
        ]
    },    
    {
        path: '**',
        component: NotFoundComponent
    }
];


/* 

import { Routes } from '@angular/router';
import { ListComponent } from './domains/products/pages/list/list.component';
import { AboutComponent } from './domains/info/about/about.component';
import { NotFoundComponent } from './domains/info/pages/not-found/not-found.component';
import { LayoutComponent } from '@shared/components/layout/layout.component';
import { ProductDetailComponent } from './domains/products/pages/product-detail/product-detail.component';
import { authGuard } from '@shared/guards/auth.guard';

export const routes: Routes = [

    {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import("./domains/shared/components/login/login.component").then(m => m.LoginComponent)
    },
    
    {
        path: '',
        component: LayoutComponent,
        children: [            
            {
                path: 'products',
                //component: AboutComponent
                loadComponent: () => import("./domains/products/pages/list/list.component").then(m => m.ListComponent),
                canActivate: [authGuard]
            },
            {
                path: 'about',
                //component: AboutComponent
                loadComponent: () => import("./domains/info/about/about.component").then(m => m.AboutComponent)
            },
            {
                path: 'product/:id',
                //component: ProductDetailComponent
                loadComponent: () => import("./domains/products/pages/product-detail/product-detail.component").then(m => m.ProductDetailComponent)
            },
            {
                path: 'checkout',
                //component: ProductDetailComponent
                loadComponent: () => import("./domains/shared/components/checkout/checkout.component").then(m => m.CheckoutComponent)
            },
            {
                path: '**',
                component: NotFoundComponent
            },
            
        ]
    }
];
*/