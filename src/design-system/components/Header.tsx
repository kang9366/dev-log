import Link from 'next/link'

export default function Header() {
    return (
        <header className="bg-gray-800 text-white p-4 w-full">
            <nav className="flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">My Blog</Link>
                <ul className="flex space-x-4">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/blog">Blog</Link></li>
                    <li><Link href="/about">About</Link></li>
                </ul>
            </nav>
        </header>
    );
}