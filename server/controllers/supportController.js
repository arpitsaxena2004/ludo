import Support from '../models/Support.js';
import User from '../models/User.js';

// @desc    Create support ticket
// @route   POST /api/support/ticket
// @access  Private
export const createTicket = async (req, res) => {
  try {
    const { subject, category, message } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.user._id);

    const ticket = await Support.create({
      user: req.user._id,
      subject,
      category,
      messages: [{
        sender: 'user',
        senderName: user.username || user.phoneNumber,
        message
      }]
    });

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

// @desc    Get user's tickets
// @route   GET /api/support/tickets
// @access  Private
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Support.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('ticketId subject category status priority createdAt');

    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Get Tickets Error:', error);
    res.status(500).json({ message: 'Failed to get tickets', error: error.message });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/support/ticket/:id
// @access  Private
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Support.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json({ ticket });
  } catch (error) {
    console.error('Get Ticket Error:', error);
    res.status(500).json({ message: 'Failed to get ticket', error: error.message });
  }
};

// @desc    Add message to ticket
// @route   POST /api/support/ticket/:id/message
// @access  Private
export const addMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await Support.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const user = await User.findById(req.user._id);

    ticket.messages.push({
      sender: 'user',
      senderName: user.username || user.phoneNumber,
      message
    });

    await ticket.save();

    res.status(200).json({
      message: 'Message added successfully',
      ticket
    });
  } catch (error) {
    console.error('Add Message Error:', error);
    res.status(500).json({ message: 'Failed to add message', error: error.message });
  }
};
