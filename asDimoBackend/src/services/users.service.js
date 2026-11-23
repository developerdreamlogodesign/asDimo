import mongoose from "mongoose";
import User from "../models/user.model.js";
import Teacher from "../models/teachers.model.js";
import RefreshToken from "../models/refreshToken.model.js";

const generateRandomPassword = (length = 10) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const createUser = async (data) => {
  const payload = { ...data };

  if (!payload.password) {
    payload.password = generateRandomPassword();
  }

  const user = await User.create(payload);

  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

export const getUsers = async () => {
  return await User.find().select("-password");
};

export const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const updateUserById = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    context: "query",
  }).select("-password");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const updateUserStatus = async (id, status) => {
  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).select("-password");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const deleteUserById = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await RefreshToken.deleteMany({ user: user._id });

  return user;
};

export const updateUserRole = async (id, role) => {
  const user = await User.findByIdAndUpdate(
    id,
    { flag: role },
    { new: true, runValidators: true }
  ).select("-password");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const updateGlobalStatus = async ({ userId, globalStatus }) => {
  if (userId === undefined || userId === null || userId === "") {
    const error = new Error("userId is required");
    error.statusCode = 400;
    throw error;
  }

  if (globalStatus === undefined || globalStatus === null) {
    const error = new Error("globalStatus is required");
    error.statusCode = 400;
    throw error;
  }

  let parsedGlobalStatus;
  if (typeof globalStatus === "boolean") {
    parsedGlobalStatus = globalStatus;
  } else if (globalStatus === "true" || globalStatus === 1 || globalStatus === "1") {
    parsedGlobalStatus = true;
  } else if (globalStatus === "false" || globalStatus === 0 || globalStatus === "0") {
    parsedGlobalStatus = false;
  } else {
    const error = new Error("globalStatus must be a boolean");
    error.statusCode = 400;
    throw error;
  }

  const numericUserId = Number(userId);
  let userQuery;
  if (Number.isFinite(numericUserId)) {
    userQuery = { userId: numericUserId };
  } else if (mongoose.Types.ObjectId.isValid(userId)) {
    userQuery = { _id: userId };
  } else {
    const error = new Error("Invalid userId");
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await User.findOneAndUpdate(
    userQuery,
    { $set: { globalStatus: parsedGlobalStatus } },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const targetUserId = updatedUser.userId;
  const teacherFilter = {
    $or: [
      { organizationAdminId: targetUserId },
      { organizationId: targetUserId },
    ],
  };

  await Teacher.updateMany(teacherFilter, {
    $set: { globalStatus: parsedGlobalStatus },
  });

  const updatedTeachers = await Teacher.find(teacherFilter);

  return {
    user: updatedUser,
    teachersUpdatedCount: updatedTeachers.length,
    teachers: updatedTeachers,
  };
};
