import jwt from 'jsonwebtoken';
import * as Yup from 'yup'; // o YUP segue o schema validation

import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation session is fails' });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check password
    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    // Check administrator
    /* if (!user.administrator) {
      return res
        .status(401)
        .json({ error: 'Login Permited only administrator' });
    } */

    const { id, name } = user;

    return res.json({
      user: {
        id,
        name,
        email,
      },
      // gerar a senha hashmd5 online tem que ser bem aleatorio, náo precisa ser uma para cada instancia, mas uma que só vc saiba qual é (nesse caso gobarberrocketseatnode2)
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
