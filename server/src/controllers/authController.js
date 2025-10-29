import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import { issueToken } from '../middleware/auth.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (!user.passwordHash) {
      console.error('⚠️ Usuário encontrado, mas sem passwordHash definido:', user.email);
      return res.status(500).json({ message: 'Erro interno de autenticação.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = issueToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
}

