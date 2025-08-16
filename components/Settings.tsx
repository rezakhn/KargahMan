import React, { useRef } from 'react';
import Card from './shared/Card';
import Button from './shared/Button';
import { DownloadIcon, UploadIcon } from './icons/Icons';

interface SettingsProps {
    onBackup: () => void;
    onRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Settings: React.FC<SettingsProps> = ({ onBackup, onRestore }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-on-surface">تنظیمات و پشتیبان‌گیری</h1>

            <Card>
                <h2 className="text-xl font-bold mb-4 text-on-surface">مدیریت داده‌ها</h2>
                <p className="text-on-surface-secondary mb-6">
                    برای جلوگیری از، از دست رفتن اطلاعات، به طور منظم از داده‌های خود نسخه پشتیبان تهیه کنید. می‌توانید فایل پشتیبان را در مواقع ضروری برای بازیابی اطلاعات استفاده کنید.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Button icon={<DownloadIcon />} onClick={onBackup}>
                        تهیه نسخه پشتیبان
                    </Button>
                    <Button variant="secondary" icon={<UploadIcon />} onClick={handleRestoreClick}>
                        بازیابی از فایل
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={onRestore}
                    />
                </div>
            </Card>
        </div>
    );
};

export default Settings;
