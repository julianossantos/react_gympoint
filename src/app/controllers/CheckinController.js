import { subDays } from 'date-fns';
import { Op } from 'sequelize';
import Checkin from '../models/Checkin';
import Student from '../models/Student';

class CheckinController {
  // List all Checkin for student informed
  async index(req, res) {
    // Check if student exists
    const checkinExists = await Checkin.findAll({
      where: { student_id: req.params.id },
      order: ['created_at'],
      attributes: ['id', 'created_at'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!checkinExists) {
      return res
        .status(400)
        .json({ error: `No have checkin for student ${req.params.id}` });
    }

    return res.json({
      checkinExists,
    });
  }

  // Create Checkin
  async store(req, res) {
    // Check if student exists
    const studentExists = await Student.findOne({
      where: { id: req.params.id },
    });

    if (!studentExists) {
      return res.status(400).json({ error: 'Student not exists' });
    }

    const today = new Date();

    const checkinExists = await Checkin.findAll({
      where: {
        student_id: req.params.id,
        created_at: {
          [Op.between]: [subDays(new Date(), 7), today],
        },
      },
      order: ['created_at'],
      attributes: ['id', 'created_at'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Check if chekins > 5 entry in last 7 days
    if (checkinExists.length > 4) {
      return res
        .status(401)
        .json({ error: 'Chekins in last 7 days overload', checkinExists });
    }

    const checkin = await Checkin.create({
      student_id: req.params.id,
    });

    return res.json({
      message: `Bem Vindo ${studentExists.name}`,
      checkin,
    });
  }
}

export default new CheckinController();
