import { Category } from "./category.model"

export interface Product {
    id: number;
    title: string;
    price: number;
    images: string[];
    name: string;
    quantity: number;
    category: Category;
}