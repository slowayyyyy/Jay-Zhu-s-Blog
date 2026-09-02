import type { ProfileConfig } from "../types/profileConfig";
import profile from "../data/profile.json";

// 后台只维护 src/data/profile.json；前台不再保留另一份重复资料。
export const profileConfig: ProfileConfig = profile;
