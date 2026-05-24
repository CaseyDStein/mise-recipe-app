-- Replace Supabase Auth with our own users table.
-- Drop existing tables (they FK to auth.users) then recreate against public.users.

DROP TABLE IF EXISTS recipe_tags CASCADE;
DROP TABLE IF EXISTS recipe_collections CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS nutritional_info CASCADE;
DROP TABLE IF EXISTS steps CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;

-- Our own users table (no dependency on auth schema)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate all tables with FK to public.users
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  total_time_minutes INTEGER,
  servings INTEGER,
  cuisine TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  name TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE nutritional_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  servings INTEGER,
  serving_size TEXT,
  calories NUMERIC,
  total_fat_g NUMERIC,
  saturated_fat_g NUMERIC,
  trans_fat_g NUMERIC,
  cholesterol_mg NUMERIC,
  sodium_mg NUMERIC,
  total_carbs_g NUMERIC,
  dietary_fiber_g NUMERIC,
  total_sugars_g NUMERIC,
  protein_g NUMERIC,
  vitamin_d TEXT,
  calcium TEXT,
  iron TEXT,
  potassium TEXT,
  UNIQUE(recipe_id)
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE recipe_collections (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (recipe_id, collection_id)
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE recipe_tags (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_steps_recipe_id ON steps(recipe_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX idx_recipe_tags_tag_id ON recipe_tags(tag_id);
CREATE INDEX idx_recipe_collections_collection_id ON recipe_collections(collection_id);

CREATE INDEX idx_recipes_fts ON recipes USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(cuisine, '') || ' ' || coalesce(category, ''))
);
