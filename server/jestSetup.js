import * as yup from 'yup';

jest.mock('yup', () => ({
  ...jest.requireActual('yup'),
  object: () => ({
    shape: jest.fn().mockReturnThis(),
    validate: jest.fn().mockResolvedValue(true)
  }),
  string: () => ({
    strict: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    required: jest.fn().mockReturnThis(),
    nullable: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis()
  }),
  number: () => ({
    integer: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis()
  }),
  boolean: () => ({
    required: jest.fn().mockReturnThis()
  })
}));