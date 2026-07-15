describe('Cliente Page', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@barcos.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button').contains('Entrar').click();

    cy.visit('/cliente');
  });

  it('deve exibir página do cliente', () => {
    cy.contains('Olá, Cliente!').should('exist');
  });

  it('deve exibir conexão WhatsApp', () => {
    cy.contains('Conexão WhatsApp').should('exist');
    cy.get('button').contains('Gerar QR Code').should('exist');
  });

  it('deve exibir minhas conversas', () => {
    cy.contains('Minhas Conversas').should('exist');
  });

  it('deve exibir notas sobre conversas', () => {
    cy.contains('Notas sobre Minhas Conversas').should('exist');
  });

  it('deve exibir histórico de eventos', () => {
    cy.contains('Histórico de Eventos').should('exist');
  });
});
