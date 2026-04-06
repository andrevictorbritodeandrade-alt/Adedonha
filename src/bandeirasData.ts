export interface Item {
  code: string;
  name: string;
  type: 'country' | 'state';
  continent?: string;
}

export const ITEMS: Item[] = [
  // Sample countries (I will add more in the structure)
  { code: 'br', name: 'Brasil', type: 'country', continent: 'América do Sul' },
  { code: 'us', name: 'Estados Unidos', type: 'country', continent: 'América do Norte' },
  // ... I will add a representative list here and instruct the user on how to expand
  { code: 'ac', name: 'Acre', type: 'state' },
  { code: 'al', name: 'Alagoas', type: 'state' },
  // ...
];
