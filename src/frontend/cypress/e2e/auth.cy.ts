describe('Autenticação', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('deve fazer login com credenciais mock', () => {
    cy.get('input[type="email"]').type('admin@cliente1.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button').contains('Entrar').click();

    cy.url().should('include', '/dashboard');
    cy.get('h1').contains('Dashboard').should('exist');
  });

  it('deve rejeitar credenciais inválidas', () => {
    cy.get('input[type="email"]').type('invalido@teste.com');
    cy.get('input[type="password"]').type('senhaerrada');
    cy.get('button').contains('Entrar').click();

    cy.get('[role="alert"]').should('contain', 'Email ou senha inválidos');
  });

  it('deve mostrar credenciais mock na login page', () => {
    cy.contains('admin@cliente1.com').should('be.visible');
    cy.contains('password123').should('be.visible');
  });

  it('deve fazer logout', () => {
    cy.get('input[type="email"]').type('admin@cliente1.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button').contains('Entrar').click();

    cy.url().should('include', '/dashboard');
    cy.get('button').contains('Sair').click();

    cy.url().should('include', '/login');
  });
});
