import { IconHome, IconCalendar, IconWallet } from './Icons';
import { useApp } from '../context/AppContext';

const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: IconHome },
    { id: 'monthly', label: 'Monthly', icon: IconCalendar },
    { id: 'accounts', label: 'Accounts', icon: IconWallet },
];

export default function BottomNav() {
    const { activeTab, setActiveTab } = useApp();

    return (
        <nav className="bottom-nav" id="bottom-navigation">
            {tabs.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    id={`nav-${id}`}
                    className={`nav-item ${activeTab === id ? 'active' : ''}`}
                    onClick={() => setActiveTab(id)}
                >
                    <Icon size={22} />
                    {label}
                </button>
            ))}
        </nav>
    );
}
