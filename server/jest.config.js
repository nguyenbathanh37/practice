export const testEnvironment = 'node';
export const verbose = true;
export const transform = {
    '^.+\\.[t|j]sx?$': 'babel-jest',
};
export const collectCoverage = true;
export const coverageDirectory = 'coverage';