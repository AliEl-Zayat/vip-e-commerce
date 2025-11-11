import { User, IUser } from './user.model';
import { UpdateProfileDto } from './dto/user.dto';
import { AppError } from '../../utils/error.util';

// Service functions (functional programming approach)
export const getProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return user;
};

export const updateProfile = async (userId: string, data: UpdateProfileDto): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw AppError.notFound('User not found');
  }

  return user;
};
