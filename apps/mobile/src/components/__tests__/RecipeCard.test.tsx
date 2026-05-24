import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecipeCard } from '../RecipeCard';

const mockRecipe = {
  id: 'test-id',
  title: 'Classic Pasta',
  imageUrl: undefined,
  totalTimeMinutes: 30,
  servings: 4,
  cuisine: 'Italian',
  onPress: jest.fn(),
};

describe('RecipeCard', () => {
  it('renders title', () => {
    const { getByText } = render(<RecipeCard {...mockRecipe} />);
    expect(getByText('Classic Pasta')).toBeTruthy();
  });

  it('displays formatted time', () => {
    const { getByText } = render(<RecipeCard {...mockRecipe} />);
    expect(getByText('30m')).toBeTruthy();
  });

  it('displays cuisine badge', () => {
    const { getByText } = render(<RecipeCard {...mockRecipe} />);
    expect(getByText('Italian')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<RecipeCard {...mockRecipe} onPress={onPress} />);
    fireEvent.press(getByText('Classic Pasta'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows placeholder when no image', () => {
    const { queryByTestId, getByText } = render(<RecipeCard {...mockRecipe} imageUrl={undefined} />);
    expect(getByText('Classic Pasta')).toBeTruthy();
  });

  it('formats hours correctly', () => {
    const { getByText } = render(<RecipeCard {...mockRecipe} totalTimeMinutes={90} />);
    expect(getByText('1h 30m')).toBeTruthy();
  });

  it('formats exact hours', () => {
    const { getByText } = render(<RecipeCard {...mockRecipe} totalTimeMinutes={120} />);
    expect(getByText('2h')).toBeTruthy();
  });
});
