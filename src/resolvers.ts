import { pubsub } from './rabbitMQ.js';

function logError(message: string, error: unknown): void {
    console.error(`${message}: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

function throwNotFoundError(item: string, id: string): never {
    logError(`${item} with ID ${id} not found`, new Error('Not Found'));
    throw new Error(`${item} not found`);
}

const resolvers = {
    User: {
        name: async (parent: { id: string }, _: any, { dataSources }: any) => {
            try {
                const name = await dataSources.nameService.getNameById(parent.id);
                return name || null;
            } catch (error) {
                logError(`Error fetching name for user with ID ${parent.id}`, error);
                return null;
            }
        },
        birthday: async (parent: { id: string }, _: any, { dataSources }: any) => {
            try {
                const birthday = await dataSources.birthdayService.getBirthdayById(parent.id);
                return birthday || null;
            } catch (error) {
                logError(`Error fetching birthday for user with ID ${parent.id}`, error);
                return null;
            }
        },
    },
    Query: {
        getUser: async (_: any, { id }: { id: string }, { dataSources }: any) => {
            try {
                const user = await dataSources.userManagementService.getUserById(id);
                if (!user) {
                    throwNotFoundError('User', id);
                }
                return user;
            } catch (error) {
                logError(`Error fetching user with ID ${id}`, error);
                return null;
            }
        },
        getAllUsers: async (_: any, __: any, { dataSources }: any) => {
            try {
                return await dataSources.userManagementService.getAllUsers();
            } catch (error) {
                logError('Error fetching all users', error);
                return [];
            }
        },
        getAllBirthdays: async (_: any, __: any, { dataSources }: any) => {
            try {
                return await dataSources.birthdayService.getAllBirthdays();
            } catch (error) {
                logError('Error fetching all birthdays', error);
                return [];
            }
        },
        getAllNames: async (_: any, __: any, { dataSources }: any) => {
            try {
                return await dataSources.nameService.getAllNames();
            } catch (error) {
                logError('Error fetching all names', error);
                return [];
            }
        }
    },
    Mutation: {
        createUser: async (_: any, { email }: { email: string }, { dataSources }: any) => {
            try {
                const user = await dataSources.userManagementService.createUser(email);
                console.log(`Created user ${user}`);
                return
            } catch (error) {
                logError('Error creating user', error);
                return null;
            }
        },
        updateBirthday: async (_: any, { id, birthday }: { id: string; birthday: string }, { dataSources }: any) => {
            try {
                const updateBirthdayResult = await dataSources.birthdayService.updateBirthday(id, { birthday });
                return updateBirthdayResult ? null : throwNotFoundError('Birthday update', id);
            } catch (error) {
                logError(`Error updating birthday for user with ID ${id}`, error);
                throw new Error(`Error updating birthday: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        updateName: async (_: any, { id, name }: { id: string; name: string }, { dataSources }: any) => {
            try {
                const updateNameResult = await dataSources.nameService.updateName(id, { name });
                return updateNameResult ? null : throwNotFoundError('Name update', id);
            } catch (error) {
                logError(`Error updating name for user with ID ${id}`, error);
                throw new Error(`Error updating name: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        deleteUser: async (_: any, { id }: { id: string }, { dataSources }: any) => {
            try {
                const user = await dataSources.userManagementService.deleteUser(id);
                if (!user) {
                    throwNotFoundError('User', id);
                }
                return
            } catch (error) {
                logError(`Error deleting user with ID ${id}`, error);
                throw error;
            }
        },
    },
    Subscription: {
        userUpdates: {
            subscribe: () => {
                console.log('Subscribing to USER_UPDATES')
                return pubsub.asyncIterator('userUpdates');
            },
        },
    },
    UserUpdateData: {
        __resolveType(userUpdateData: any) {
            console.log('UserUpdateData', userUpdateData);
            if (userUpdateData.email) {
                return 'User';
            } else if (userUpdateData.name) {
                return 'Name';
            } else if (userUpdateData.birthday) {
                return 'Birthday';
            }
            return 'User';
        },
    },
};

export default resolvers;
