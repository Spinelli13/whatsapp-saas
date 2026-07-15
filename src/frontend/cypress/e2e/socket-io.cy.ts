describe('Socket.io Real-time', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@cliente1.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button').contains('Entrar').click();
  });

  it('deve carregar dashboard após login', () => {
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('exist');
  });

  it('deve exibir componente de fila pronto para eventos em tempo real', () => {
    cy.contains('Fila de Mensagens').should('exist');
  });
});
