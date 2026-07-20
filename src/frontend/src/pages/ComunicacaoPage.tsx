import { useState, useEffect, useCallback } from 'react';
import { Mail, MessageSquare, Plus, X, Send } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

interface EmailItem {
  id: string;
  destinatario_email: string;
  assunto: string;
  corpo?: string;
  status: 'rascunho' | 'enviando' | 'enviado' | 'erro';
  tipo: string;
  criado_em: string;
  data_envio?: string;
  remetente?: { nome: string };
}

interface SMSItem {
  id: string;
  numero_destino: string;
  mensagem: string;
  status: 'rascunho' | 'enviando' | 'enviado' | 'erro';
  tipo: string;
  criado_em: string;
  data_envio?: string;
  remetente?: { nome: string };
}

type Aba = 'emails' | 'sms';

const STATUS_COR: Record<string, string> = {
  rascunho: 'bg-gray-500',
  enviando: 'bg-blue-500',
  enviado:  'bg-green-500',
  erro:     'bg-red-500',
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  enviando: 'Enviando',
  enviado:  'Enviado',
  erro:     'Erro',
};

function MensagemCard({
  titulo, preview, meta, status, data, isDark,
}: {
  titulo: string; preview?: string; meta?: string;
  status: string; data: string; isDark: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
      isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            {titulo}
          </p>
          {meta && (
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{meta}</p>
          )}
          {preview && (
            <p className={`text-xs mt-1.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {preview}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COR[status]}`} />
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
            {new Date(data).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ComunicacaoPage() {
  const { theme } = useThemeStore();
  const token = useAuthStore((s) => s.token);
  const isDark = theme === 'dark';

  const [aba, setAba] = useState<Aba>('emails');
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [smsList, setSmsList] = useState<SMSItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [formEmail, setFormEmail] = useState({ destinatario_email: '', assunto: '', corpo: '' });
  const [formSMS, setFormSMS] = useState({ numero_destino: '', mensagem: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const carregar = useCallback(async () => {
    setLoading(true);
    const [eRes, sRes] = await Promise.all([
      fetch('/api/comunicacao/emails', { headers }),
      fetch('/api/comunicacao/sms', { headers }),
    ]);
    if (eRes.ok) setEmails(await eRes.json());
    if (sRes.ok) setSmsList(await sRes.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { carregar(); }, [carregar]);

  async function enviarEmail() {
    if (!formEmail.destinatario_email || !formEmail.assunto) return;
    setSalvando(true);
    setErroEnvio('');
    const res = await fetch('/api/comunicacao/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify(formEmail),
    });
    setSalvando(false);
    if (res.ok) {
      setModal(false);
      setFormEmail({ destinatario_email: '', assunto: '', corpo: '' });
      carregar();
    } else {
      const data = await res.json();
      setErroEnvio(data.error || 'Erro ao enviar');
    }
  }

  async function enviarSMS() {
    if (!formSMS.numero_destino || !formSMS.mensagem) return;
    setSalvando(true);
    setErroEnvio('');
    const res = await fetch('/api/comunicacao/sms', {
      method: 'POST',
      headers,
      body: JSON.stringify(formSMS),
    });
    setSalvando(false);
    if (res.ok) {
      setModal(false);
      setFormSMS({ numero_destino: '', mensagem: '' });
      carregar();
    } else {
      const data = await res.json();
      setErroEnvio(data.error || 'Erro ao enviar');
    }
  }

  function abrirModal() {
    setErroEnvio('');
    setModal(true);
  }

  const tabClass = (t: Aba) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
      aba === t
        ? `border-cyan-500 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`
        : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'}`
    }`;

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
    isDark
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500'
  }`;

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <Send className={`h-5 w-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Comunicação</h1>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
        >
          <Plus className="h-4 w-4" /> Nova mensagem
        </button>
      </div>

      {/* Tabs */}
      <div className={`px-6 border-b flex gap-1 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <button className={tabClass('emails')} onClick={() => setAba('emails')}>
          <Mail className="h-4 w-4" /> Emails
          <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
            isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'
          }`}>{emails.length}</span>
        </button>
        <button className={tabClass('sms')} onClick={() => setAba('sms')}>
          <MessageSquare className="h-4 w-4" /> SMS
          <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
            isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'
          }`}>{smsList.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className={`text-center py-12 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Carregando...
          </div>
        ) : aba === 'emails' ? (
          <div className="space-y-2">
            {emails.length === 0 ? (
              <div className={`text-center py-16 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum email ainda</p>
              </div>
            ) : emails.map((e) => (
              <MensagemCard
                key={e.id}
                titulo={e.assunto}
                meta={`Para: ${e.destinatario_email}`}
                preview={e.corpo}
                status={e.status}
                data={e.criado_em}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {smsList.length === 0 ? (
              <div className={`text-center py-16 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum SMS ainda</p>
              </div>
            ) : smsList.map((s) => (
              <MensagemCard
                key={s.id}
                titulo={`Para: ${s.numero_destino}`}
                preview={s.mensagem}
                status={s.status}
                data={s.criado_em}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-lg rounded-xl border shadow-xl ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                Nova mensagem
              </h2>
              <button onClick={() => setModal(false)} className={`p-1 rounded ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs do modal */}
            <div className={`px-5 pt-4 flex gap-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <button
                onClick={() => setAba('emails')}
                className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                  aba === 'emails'
                    ? `border-cyan-500 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`
                    : `border-transparent ${isDark ? 'text-slate-400' : 'text-gray-500'}`
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setAba('sms')}
                className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                  aba === 'sms'
                    ? `border-cyan-500 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`
                    : `border-transparent ${isDark ? 'text-slate-400' : 'text-gray-500'}`
                }`}
              >
                SMS
              </button>
            </div>

            <div className="p-5 space-y-3">
              {aba === 'emails' ? (
                <>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Destinatário *
                    </label>
                    <input
                      type="email"
                      value={formEmail.destinatario_email}
                      onChange={(e) => setFormEmail((f) => ({ ...f, destinatario_email: e.target.value }))}
                      placeholder="email@destino.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Assunto *
                    </label>
                    <input
                      type="text"
                      value={formEmail.assunto}
                      onChange={(e) => setFormEmail((f) => ({ ...f, assunto: e.target.value }))}
                      placeholder="Assunto do email"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Mensagem
                    </label>
                    <textarea
                      rows={5}
                      value={formEmail.corpo}
                      onChange={(e) => setFormEmail((f) => ({ ...f, corpo: e.target.value }))}
                      placeholder="Escreva sua mensagem..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Número *
                    </label>
                    <input
                      type="tel"
                      value={formSMS.numero_destino}
                      onChange={(e) => setFormSMS((f) => ({ ...f, numero_destino: e.target.value }))}
                      placeholder="+55 11 99999-9999"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Mensagem *
                    </label>
                    <textarea
                      rows={4}
                      value={formSMS.mensagem}
                      onChange={(e) => setFormSMS((f) => ({ ...f, mensagem: e.target.value }))}
                      placeholder="Escreva o SMS (máx. 160 caracteres)"
                      maxLength={160}
                      className={`${inputClass} resize-none`}
                    />
                    <p className={`text-xs mt-1 text-right ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {formSMS.mensagem.length}/160
                    </p>
                  </div>
                </>
              )}

              {erroEnvio && (
                <p className="text-xs text-red-500">{erroEnvio}</p>
              )}
            </div>

            <div className={`px-5 py-4 border-t flex justify-end gap-2 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <button
                onClick={() => setModal(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Cancelar
              </button>
              <button
                onClick={aba === 'emails' ? enviarEmail : enviarSMS}
                disabled={salvando || (aba === 'emails' ? (!formEmail.destinatario_email || !formEmail.assunto) : (!formSMS.numero_destino || !formSMS.mensagem))}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                {salvando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
