import * as Yup from 'yup'; // o YUP segue o schema validation
import { parseISO } from 'date-fns';
import Student from '../models/Student';
import HelpOrder from '../models/HelpOrder';

class HelpOrderController {
  // List all quastions of student
  async index(req, res) {
    // Find student questions
    const studentQuestions = await HelpOrder.findAll({
      where: { student_id: req.params.id },
      order: ['created_at'],
      attributes: ['id', 'question', 'created_at'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!studentQuestions) {
      return res
        .status(400)
        .json({ error: `No have checkin for student ${req.params.id}` });
    }

    return res.json({
      studentQuestions,
    });
  }

  // Create answer
  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    const { question } = req.body;

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation is fails' });
    }
    // Check if student exists
    const studentExists = await Student.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'name'],
    });

    if (!studentExists) {
      return res.status(400).json({ error: 'Student not exists' });
    }

    const createQuestion = await HelpOrder.create({
      student_id: req.params.id,
      question,
    });

    return res.json({
      message: 'Mensagem enviada! Enviaremos a resposta o mais breve possível',
      student_id: studentExists.id,
      name: studentExists.name,
      question,
    });
  }

  // Update to answer
  async update(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    const { answer } = req.body;

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation is fails' });
    }

    // Find student questions
    const questions = await HelpOrder.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'question', 'created_at'],
    });

    if (!questions) {
      return res.status(400).json({
        error: `No have questions to answer for this id - ${req.params.id}`,
      });
    }

    const answered = await HelpOrder.update(
      {
        answer,
        answer_at: new Date(),
      },
      { where: { id: req.params.id } }
    );

    return res.json({
      message: `Resposta enviada a(o) aluno(a)`,
      id_question: questions.id,
      question: questions.question,
      answer: req.body.answer,
    });
  }
}

export default new HelpOrderController();
