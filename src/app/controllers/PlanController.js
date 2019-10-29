import * as Yup from 'yup'; // o YUP segue o schema validation
import Plan from '../models/Plan';

class PlanController {
  // Route Get
  async index(req, res) {
    const plans = await Plan.findAll();

    return res.json(plans);
  }

  // Route Post
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number()
        .round()
        .positive()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation is fails' });
    }

    const planExists = await Plan.findOne({
      where: { title: req.body.title },
    });

    if (planExists) {
      return res.status(400).json({ error: 'Plan already exists' });
    }

    const { id, title, duration, price } = await Plan.create(req.body);

    return res.json({
      id,
      title,
      duration,
      price,
    });
  }

  // Route put
  async update(req, res) {
    // validation params sended
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number()
        .round()
        .positive()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation is fails' });
    }

    // Check if plan exists
    const planExists = await Plan.findByPk(req.params.id);

    if (!planExists) {
      return res
        .status(400)
        .json({ error: `Plan ${req.params.id} not exists` });
    }

    // Updated plan
    const planUpdated = await Plan.update(req.body, {
      where: { id: req.params.id },
    });

    if (!planUpdated) {
      return res
        .status(400)
        .json({ error: 'Updated plan is not possible. Contact support' });
    }

    // return res.json(planUpdated);
    return res.json(`updated plan to ${req.body.title}`);
  }

  // Route Delete
  async delete(req, res) {
    const planExists = await Plan.findByPk(req.params.id);

    if (!planExists) {
      return res
        .status(400)
        .json({ error: `Plan ${req.params.id} not exists` });
    }

    const data = await Plan.destroy({
      where: { id: req.params.id },
    });

    if (!data) {
      return res
        .status(400)
        .json({ error: 'Delete plan is not possible. Contact support' });
    }

    return res.json(`Deleted plan ${planExists.id} - ${planExists.title}.`);
  }
}

export default new PlanController();
