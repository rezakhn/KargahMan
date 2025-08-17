
import React, { useRef } from 'react';
import Card from './shared/Card';
import Button from './shared/Button';
import { DownloadIcon, UploadIcon } from './icons/Icons';

interface SettingsProps {
    onBackup: () => void;
    onRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isFSApiSupported: boolean;
    fileHandle: FileSystemFileHandle | null;
    autoSave: boolean;
    onConnectFile: () => void;
    onLoadFromFile: () => void;
    onSaveToFile: () => void;
    onToggleAutoSave: (enabled: boolean) => void;
}

const Settings: React.FC<SettingsProps> = (props) => {
    const { 
        onBackup, 
        onRestore, 
        isFSApiSupported,
        fileHandle,
        autoSave,
        onConnectFile,
        onLoadFromFile,
        onSaveToFile,
        onToggleAutoSave
    } = props;
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-on-surface">تنظیمات و پشتیبان‌گیری</h1>

            <Card>
                <h2 className="text-xl font-bold mb-4 text-on-surface">مدیریت داده‌ها</h2>
                 {isFSApiSupported ? (
                    <div>
                        <p className="text-on-surface-secondary mb-6">
                            برای جلوگیری از پاک شدن اطلاعات با پاک کردن حافظه مرورگر، برنامه را به یک فایل محلی متصل کنید. داده‌ها به صورت خودکار یا دستی در این فایل ذخیره می‌شوند و مستقل از مرورگر خواهند بود.
                        </p>
                        <div className="mt-4 p-4 border border-gray-600 rounded-lg">
                            <p>وضعیت: {fileHandle 
                                ? <span className="text-green-400 font-bold">متصل به فایل <span dir="ltr" className="font-mono">{fileHandle.name}</span></span> 
                                : <span className="text-yellow-400 font-bold">به هیچ فایلی متصل نیست</span>}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-6">
                            <Button icon={<DownloadIcon />} onClick={onConnectFile}>{fileHandle ? 'تغییر فایل' : 'اتصال فایل داده'}</Button>
                            <Button variant="secondary" onClick={onLoadFromFile}>بارگذاری از فایل</Button>
                            <Button variant="secondary" onClick={onSaveToFile} disabled={!fileHandle}>ذخیره در فایل</Button>
                        </div>
                        <div className="mt-6">
                            <label className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={autoSave} 
                                    onChange={(e) => onToggleAutoSave(e.target.checked)} 
                                    disabled={!fileHandle} 
                                    className="rounded bg-gray-800 border-gray-600 text-primary focus:ring-primary disabled:opacity-50" 
                                />
                                <span className="mr-3 text-on-surface">ذخیره خودکار هنگام تغییرات (با تاخیر ۲ ثانیه)</span>
                            </label>
                            {!fileHandle && <p className="text-xs text-on-surface-secondary mt-1 mr-8">برای فعال‌سازی، ابتدا یک فایل را متصل کنید.</p>}
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-on-surface-secondary mb-6">
                            مرورگر شما از ذخیره‌سازی مستقیم روی فایل پشتیبانی نمی‌کند. برای جلوگیری از، از دست رفتن اطلاعات، به طور منظم از داده‌های خود نسخه پشتیبان تهیه کنید و آن را در جای امنی ذخیره کنید.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button icon={<DownloadIcon />} onClick={onBackup}>
                                تهیه نسخه پشتیبان (دانلود .json)
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
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Settings;
