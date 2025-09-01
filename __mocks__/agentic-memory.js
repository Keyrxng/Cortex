module.exports = {
  createMemoryInstance: jest.fn().mockReturnValue({
    add: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([]),
    getAll: jest.fn().mockResolvedValue([])
  }),
  addMemory: jest.fn().mockResolvedValue(true),
  queryMemory: jest.fn().mockResolvedValue([])
};
