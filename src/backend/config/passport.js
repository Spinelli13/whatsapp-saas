'use strict';

const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

// ── Local ──────────────────────────────────────────────────────────────────
passport.use(
  new LocalStrategy({ usernameField: 'email', passwordField: 'senha' }, async (email, senha, done) => {
    try {
      const usuario = await Usuario.findOne({ where: { email } });
      if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
        return done(null, false, { message: 'Credenciais inválidas' });
      }
      return done(null, usuario);
    } catch (err) {
      return done(err);
    }
  })
);

// ── Google OAuth2 ──────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Email não disponível no perfil Google'));

          let usuario = await Usuario.findOne({ where: { email } });
          if (!usuario) {
            usuario = await Usuario.create({
              email,
              nome: profile.displayName || email,
              senha: await bcrypt.hash(accessToken.slice(0, 20), 10),
              cliente_id: 1,
              role: 'atendente',
            });
          }
          return done(null, usuario);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// ── Microsoft OAuth2 ───────────────────────────────────────────────────────
let MicrosoftStrategy;
try {
  MicrosoftStrategy = require('passport-microsoft').Strategy;
} catch {
  // Optional — not installed or not configured
}

if (MicrosoftStrategy && process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: '/api/auth/microsoft/callback',
        tenant: process.env.MICROSOFT_TENANT_ID || 'common',
        scope: ['user.read'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || profile._json?.mail;
          if (!email) return done(new Error('Email não disponível no perfil Microsoft'));

          let usuario = await Usuario.findOne({ where: { email } });
          if (!usuario) {
            usuario = await Usuario.create({
              email,
              nome: profile.displayName || email,
              senha: await bcrypt.hash(accessToken.slice(0, 20), 10),
              cliente_id: 1,
              role: 'atendente',
            });
          }
          return done(null, usuario);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// ── Session serialization ──────────────────────────────────────────────────
passport.serializeUser((usuario, done) => done(null, usuario.id));

passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await Usuario.findByPk(id);
    done(null, usuario);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
