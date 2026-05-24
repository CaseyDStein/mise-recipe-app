export interface Ingredient {
  id?: string;
  recipeId?: string;
  text: string;
  quantity?: string;
  unit?: string;
  name?: string;
  notes?: string;
}

export interface Step {
  id?: string;
  recipeId?: string;
  order: number;
  text: string;
}

export interface NutritionalInfo {
  id?: string;
  recipeId?: string;
  servings?: number;
  servingSize?: string;
  calories?: number;
  totalFatG?: number;
  saturatedFatG?: number;
  transFatG?: number;
  cholesterolMg?: number;
  sodiumMg?: number;
  totalCarbsG?: number;
  dietaryFiberG?: number;
  totalSugarsG?: number;
  proteinG?: number;
  vitaminD?: string;
  calcium?: string;
  iron?: string;
  potassium?: string;
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  sourceUrl: string;
  imageUrl?: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  servings?: number;
  cuisine?: string;
  category?: string;
  ingredients: Ingredient[];
  steps: Step[];
  nutritionalInfo?: NutritionalInfo;
  tags?: string[];
  collectionIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeSummary {
  id: string;
  title: string;
  sourceUrl: string;
  imageUrl?: string;
  description?: string;
  totalTimeMinutes?: number;
  servings?: number;
  cuisine?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  recipeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  recipeCount?: number;
}

export interface ImportRecipeRequest {
  url: string;
}

export interface ImportRecipeResponse {
  recipe: Recipe;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SearchRecipesParams {
  query?: string;
  tags?: string[];
  collectionId?: string;
  page?: number;
  pageSize?: number;
}
