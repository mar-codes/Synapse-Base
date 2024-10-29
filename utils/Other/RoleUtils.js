const { PermissionsBitField } = require('discord.js');

class RoleUtils {
   constructor(client) {
       this.client = client;
   }

   async compareRoles(roleId1, roleId2, guildId) {
       if (!roleId1 || !roleId2) return null;
       
       const guild = await this.client.guilds.fetch(guildId);
       if (!guild) return null;
       
       const [role1, role2] = await Promise.all([
           guild.roles.fetch(roleId1),
           guild.roles.fetch(roleId2)
       ]);
       
       if (!role1 || !role2) return null;

       if (role1.position === role2.position) {
           return {
               higher: null,
               lower: null,
               equal: true
           };
       }

       return {
           higher: role1.position > role2.position ? role1.id : role2.id,
           lower: role1.position > role2.position ? role2.id : role1.id,
           equal: false
       };
   }
}

module.exports = (client) => {
   const roleUtils = new RoleUtils(client);
   client.roleUtils = roleUtils;
   return roleUtils;
};