import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token no provided' });
  }

  // desistruturação que não precisou deixar a primeira variavel que é o bearer 'visivel'
  const [, token] = authHeader.split(' ');

  try {
    // o parenteses na sequencia do outro é porque a promisify retorna uma função e pode ser executada na sequencia
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    req.userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' });
  }

  return next();
};
