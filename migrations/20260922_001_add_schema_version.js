// migrations/20260922_001_add_schema_version.js
module.exports = {
  async up(db, client) {
    const collections = [
      'users',
      'roles_permissions',
      'teams',
      'clients',
      'requirements',
      'requirement_histories',
      'candidates',
      'candidate_documents',
      'submissions',
      'submission_histories',
      'interviews',
      'interview_feedbacks',
      'offers',
      'ai_parsing_jobs',
      'ai_match_scores',
      'file_metadata',
      'activity_logs',
      'recruiter_analytics',
      'organizations',
      'notifications',
      'email_templates',
      'candidate_blacklist',
      'saved_searches',
    ];

    for (const collectionName of collections) {
      await db.collection(collectionName).updateMany(
        { schemaVersion: { $exists: false } },
        { $set: { schemaVersion: 1 } }
      );
    }
  },

  async down(db, client) {
    // Revert schemaVersion field if needed
    const collections = [
      'users',
      'roles_permissions',
      'teams',
      'clients',
      'requirements',
      'requirement_histories',
      'candidates',
      'candidate_documents',
      'submissions',
      'submission_histories',
      'interviews',
      'interview_feedbacks',
      'offers',
      'ai_parsing_jobs',
      'ai_match_scores',
      'file_metadata',
      'activity_logs',
      'recruiter_analytics',
      'organizations',
      'notifications',
      'email_templates',
      'candidate_blacklist',
      'saved_searches',
    ];

    for (const collectionName of collections) {
      await db.collection(collectionName).updateMany(
        {},
        { $unset: { schemaVersion: "" } }
      );
    }
  }
};
