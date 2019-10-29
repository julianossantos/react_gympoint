import * as Yup from 'yup'; // o YUP segue o schema validation
import {
  startOfHour,
  parseISO,
  isBefore,
  isAfter,
  addMonths,
  format,
} from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import Student from '../models/Student';
import Plan from '../models/Plan';
import StudentEnrollment from '../models/StudentEnrollment';

import Mail from '../../lib/Mail';

class StudentEnrollmentController {
  async index(req, res) {
    const enrollments = await StudentEnrollment.findAll({
      order: ['start_date'],
      attributes: ['id', 'start_date', 'end_date', 'price'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });

    if (!enrollments) {
      return res
        .status(400)
        .json({ error: 'No available enrollmens registred' });
    }

    return res.json(enrollments);
  }

  // Create enrollment (POST)
  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    const { student_id, plan_id, start_date } = req.body;

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation is fails' });
    }

    // Check if student exists
    const studentExists = await Student.findOne({
      where: { id: student_id },
    });

    if (!studentExists) {
      return res.status(400).json({ error: 'Student not exists' });
    }

    // Check if plan exists
    const planExists = await Plan.findOne({
      where: { id: plan_id },
    });

    if (!planExists) {
      return res.status(400).json({ error: 'Plan not exists' });
    }

    // Check if enrollment exists
    const enrollmentExists = await StudentEnrollment.findOne({
      where: { student_id },
    });

    const startDate = parseISO(start_date);
    // Date od finished plan
    const dateEndPlan = addMonths(parseISO(start_date), planExists.duration);

    if (enrollmentExists && !isBefore(dateEndPlan, new Date())) {
      return res
        .status(400)
        .json({ error: 'User have an enrollment in progress registred' });
    }

    const hourStart = startOfHour(parseISO(start_date));

    // Check past date
    if (isBefore(hourStart, new Date())) {
      return res.status(401).json({ error: 'Past date is not  permited' });
    }

    // Value od plan
    const planValue = planExists.price * planExists.duration;

    const enrollmentStudent = await StudentEnrollment.create({
      student_id,
      plan_id,
      start_date: startDate,
      end_date: dateEndPlan,
      price: planValue,
    });

    await Mail.sendMail({
      to: `${studentExists.name} <${studentExists.email}>`,
      subject: `Bem vindo ${studentExists.email} a Gympoint`,
      template: 'welcome',
      context: {
        student: studentExists.name,
        plan: planExists.title,
        dateStart: format(startDate, 'dd/MM/yyyy', { locale: pt }),
        dateEnd: format(dateEndPlan, 'dd/MM/yyy', { locale: pt }),
        price: `R$ ${planValue}`,
      },
      // text: `Olá ${studentExists.email}! Sua matricula foi confirmada na Gympoint.`,
    });

    return res.json({
      message: `Matricula criada para o usuário ${studentExists.name} no plano ${planExists.title} com o valor de R$${planValue}`,
      plan: enrollmentStudent,
    });
  }

  // Put of enrollment
  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    const { student_id, plan_id, start_date } = req.body;

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation is fails' });
    }

    // Check if student exists
    const studentExists = await Student.findOne({
      where: { id: student_id },
    });

    if (!studentExists) {
      return res.status(400).json({ error: 'Student not exists' });
    }

    // Check if plan exists
    const planExists = await Plan.findOne({
      where: { id: plan_id },
    });

    if (!planExists) {
      return res.status(400).json({ error: 'Plan not exists' });
    }

    // Check if enrollment exists
    const enrollmentExists = await StudentEnrollment.findOne({
      where: { student_id },
    });

    const startDate = parseISO(start_date);
    // Date od finished plan
    const dateEndPlan = addMonths(parseISO(start_date), planExists.duration);

    if (enrollmentExists && !isAfter(dateEndPlan, new Date())) {
      return res
        .status(400)
        .json({ error: 'User not have an enrollment in progress registred' });
    }

    const hourStart = startOfHour(parseISO(start_date));

    // Check past date
    if (isBefore(hourStart, new Date())) {
      return res.status(401).json({ error: 'Past date is not  permited' });
    }

    // Value od plan
    const planValue = planExists.price * planExists.duration;

    const enrollmentStudent = await StudentEnrollment.update(
      {
        student_id,
        plan_id,
        start_date: startDate,
        end_date: dateEndPlan,
        price: planValue,
      },
      { where: { id: req.params.id } }
    );

    return res.json({
      message: `Matricula criada para o usuário ${studentExists.name} no plano ${planExists.title} com o valor de R$${planValue}`,
      plan: enrollmentStudent,
    });
  }

  // Delete an enrollment
  async delete(req, res) {
    // Check if enrollment exists
    const enrollmentExists = await StudentEnrollment.findOne({
      where: { id: req.params.id },
    });

    const deleteEnrollment = await StudentEnrollment.destroy({
      where: { id: req.params.id },
    });

    if (!deleteEnrollment) {
      return res.status(400).json({ error: 'Enrollment not finded' });
    }

    if (!enrollmentExists) {
      return res
        .status(400)
        .json({ error: 'Delete enrollment is not possible. Contact support' });
    }

    return res.json({ message: `Enrollment deleted` });
  }
}

export default new StudentEnrollmentController();
