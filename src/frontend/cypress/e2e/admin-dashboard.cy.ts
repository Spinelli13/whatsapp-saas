describe('Admin Dashboard', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@cliente1.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button').contains('Entrar').click();
    cy.url().should('include', '/dashboard');
  });

  it('deve exibir métricas do dashboard', () => {
    cy.contains('Tickets Hoje').should('exist');
    cy.contains('Em Atendimento').should('exist');
    cy.contains('Resolvidos').should('exist');
    cy.contains('Satisfação Média').should('exist');
  });

  it('deve exibir fila de mensagens', () => {
    cy.contains('Fila de Mensagens').should('exist');
  });

  it('deve exibir painel de notas', () => {
    cy.contains('Notas Internas').should('exist');
  });

  it('deve exibir histórico', () => {
    cy.contains('Histórico').should('exist');
  });

  it('deve ter sidebar com navegação', () => {
    cy.contains('Dashboard').should('exist');
    cy.contains('Fila').should('exist');
  });
});
