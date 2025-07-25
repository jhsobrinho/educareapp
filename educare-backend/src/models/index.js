const { sequelize } = require('../config/database');

// Importação dos modelos
const User = require('./User');
const Profile = require('./Profile');
const Child = require('./Child');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const License = require('./License');
const SubscriptionPlan = require('./SubscriptionPlan');
const Subscription = require('./Subscription');
const Quiz = require('./Quiz');
const Question = require('./Question');
const QuizQuestion = require('./QuizQuestion');
const QuizSession = require('./QuizSession');
const Answer = require('./Answer');
const Achievement = require('./Achievement');
const UserAchievement = require('./UserAchievement');
const Journey = require('./Journey');
const UserJourney = require('./UserJourney');
const ChatGroup = require('./ChatGroup');
const ChatMessage = require('./ChatMessage');

// Definição das associações

// User <-> Profile (1:1)
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId' });

// Profile <-> Child (1:N)
Profile.hasMany(Child, { foreignKey: 'profileId', as: 'children' });
Child.belongsTo(Profile, { foreignKey: 'profileId' });

// User <-> Team (1:N) - Owner
User.hasMany(Team, { foreignKey: 'ownerId', as: 'ownedTeams' });
Team.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Team <-> TeamMember (1:N)
Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'members' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });

// User <-> TeamMember (1:N)
User.hasMany(TeamMember, { foreignKey: 'userId', as: 'teamMemberships' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> License (1:N) - Owner
User.hasMany(License, { foreignKey: 'ownerId', as: 'ownedLicenses' });
License.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// License <-> Team (1:N)
License.hasMany(Team, { foreignKey: 'licenseId', as: 'teams' });
Team.belongsTo(License, { foreignKey: 'licenseId', as: 'license' });

// SubscriptionPlan <-> Subscription (1:N)
SubscriptionPlan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

// User <-> Subscription (1:N)
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Quiz <-> Question (N:M)
Quiz.belongsToMany(Question, { through: QuizQuestion, foreignKey: 'quizId', as: 'questions' });
Question.belongsToMany(Quiz, { through: QuizQuestion, foreignKey: 'questionId', as: 'quizzes' });

// Child <-> QuizSession (1:N)
Child.hasMany(QuizSession, { foreignKey: 'childId', as: 'quizSessions' });
QuizSession.belongsTo(Child, { foreignKey: 'childId', as: 'child' });

// QuizSession <-> Answer (1:N)
QuizSession.hasMany(Answer, { foreignKey: 'sessionId', as: 'sessionAnswers' });
Answer.belongsTo(QuizSession, { foreignKey: 'sessionId', as: 'session' });

// Question <-> Answer (1:N)
Question.hasMany(Answer, { foreignKey: 'questionId', as: 'answers' });
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// User <-> UserAchievement (1:N)
User.hasMany(UserAchievement, { foreignKey: 'userId', as: 'achievements' });
UserAchievement.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Child <-> UserAchievement (1:N)
Child.hasMany(UserAchievement, { foreignKey: 'childId', as: 'achievements' });
UserAchievement.belongsTo(Child, { foreignKey: 'childId', as: 'child' });

// Achievement <-> UserAchievement (1:N)
Achievement.hasMany(UserAchievement, { foreignKey: 'achievementId', as: 'userAchievements' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievementId', as: 'achievement' });

// User <-> UserJourney (1:N)
User.hasMany(UserJourney, { foreignKey: 'userId', as: 'journeys' });
UserJourney.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Child <-> UserJourney (1:N)
Child.hasMany(UserJourney, { foreignKey: 'childId', as: 'journeys' });
UserJourney.belongsTo(Child, { foreignKey: 'childId', as: 'child' });

// Journey <-> UserJourney (1:N)
Journey.hasMany(UserJourney, { foreignKey: 'journeyId', as: 'userJourneys' });
UserJourney.belongsTo(Journey, { foreignKey: 'journeyId', as: 'journey' });

// User <-> Journey (1:N) - Creator
User.hasMany(Journey, { foreignKey: 'createdBy', as: 'createdJourneys' });
Journey.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// User <-> Quiz (1:N) - Creator
User.hasMany(Quiz, { foreignKey: 'createdBy', as: 'createdQuizzes' });
Quiz.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// === ASSOCIAÇÕES DE CHAT ===

// Team <-> ChatGroup (1:N)
Team.hasMany(ChatGroup, { foreignKey: 'team_id', as: 'chatGroups' });
ChatGroup.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

// Child <-> ChatGroup (1:N)
Child.hasMany(ChatGroup, { foreignKey: 'child_id', as: 'chatGroups' });
ChatGroup.belongsTo(Child, { foreignKey: 'child_id', as: 'child' });

// ChatGroup <-> ChatMessage (1:N)
ChatGroup.hasMany(ChatMessage, { foreignKey: 'chat_group_id', as: 'messages' });
ChatMessage.belongsTo(ChatGroup, { foreignKey: 'chat_group_id', as: 'chatGroup' });

// User <-> ChatMessage (1:N) - Sender
User.hasMany(ChatMessage, { foreignKey: 'sender_id', as: 'sentMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// ChatMessage <-> ChatMessage (Self-referencing for replies)
ChatMessage.belongsTo(ChatMessage, { foreignKey: 'reply_to_id', as: 'replyTo' });
ChatMessage.hasMany(ChatMessage, { foreignKey: 'reply_to_id', as: 'replies' });

// Exportação dos modelos
module.exports = {
  sequelize,
  User,
  Profile,
  Child,
  Team,
  TeamMember,
  License,
  SubscriptionPlan,
  Subscription,
  Quiz,
  Question,
  QuizQuestion,
  QuizSession,
  Answer,
  Achievement,
  UserAchievement,
  Journey,
  UserJourney,
  ChatGroup,
  ChatMessage
};
