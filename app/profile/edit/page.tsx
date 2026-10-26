'use client';
import {useAccount} from '../../../components/account-provider';
import {AccountScreen,AccountGate} from '../../../components/account-screen';
import {ProfileForm} from '../../../components/profile-form';
export default function EditProfilePage(){const {user,ready}=useAccount();return <AccountScreen title="プロフィールを編集" back="/profile" backLabel="プロフィール">{ready&&user?<ProfileForm key={user.id} user={user}/>:<AccountGate next="/profile/edit"/>}</AccountScreen>}
