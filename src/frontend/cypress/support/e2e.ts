// Suporte global para testes E2E

beforeEach(() => {
  // Limpar localStorage antes de cada teste para estado limpo
  cy.window().then((win) => {
    win.localStorage.clear();
  });
});
