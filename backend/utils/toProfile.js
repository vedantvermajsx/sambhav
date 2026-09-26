/** The signed-in user's own profile. Never includes the password hash. */
module.exports = function toProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points ?? 0,
    initials: user.initials,
    avatarUrl: user.avatarUrl,
  };
};
