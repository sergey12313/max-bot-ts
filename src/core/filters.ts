export const createdMessageBodyHas = (...keys: string[]) => {
  return (update: any): boolean => {
    if (update.update_type !== 'message_created') return false;

    for (const key of keys) {
      if (!(key in update.message.body)) return false;
      if (update.message.body[key] === undefined) return false;
    }

    return true;
  };
};
