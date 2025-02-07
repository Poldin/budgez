import React from 'react';
import { Instagram, Twitter, Linkedin, Facebook, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 mt-10 p-4">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Logo and Social Links */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              {/* <Zap className="h-6 w-6 text-blue-600" /> */}
              <span className="text-lg font-bold">B) Budgez</span>
            </div>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/livinginlarin/" className="text-gray-600 hover:text-gray-900" target="_blank">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://x.com/livinginlarin" className="text-gray-600 hover:text-gray-900" target="_blank">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/larin-group/posts/?feedView=all" className="text-gray-600 hover:text-gray-900" target="_blank">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/livinginlarin/?locale=it_IT" className="text-gray-600 hover:text-gray-900" target="_blank">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/user/larinBL" className="text-gray-600 hover:text-gray-900" target="_blank">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div className="col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Azienda</h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-gray-600 hover:text-gray-900 text-sm">Chi siamo</a>
              </li>
              <li>
                <a href="https://www.larin.it/careers/" className="text-gray-600 hover:text-gray-900 text-sm" target="_blank">Lavora con noi</a>
              </li>
              {/* <li>
                <a href="/security" className="text-gray-600 hover:text-gray-900">Sicurezza</a>
              </li>
              <li>
                <a href="/status" className="text-gray-600 hover:text-gray-900">Status</a>
              </li> */}
            </ul>
          </div>

          {/* Download Links */}
          {/* <div className="col-span-1">
            <h3 className="font-medium text-gray-900 mb-4">Download</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">iOS & Android</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">Mac & Windows</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">Web Clipper</a>
              </li>
            </ul>
          </div> */}

          {/* Resources Links */}
          <div className="col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Risorse</h3>
            <ul className="space-y-3">
              {/* <li>
                <a href="/help" className="text-gray-600 hover:text-gray-900">Centro assistenza</a>
              </li> */}
              <li>
                <a href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">Pricing</a>
              </li>
              {/* <li>
                <a href="/blog" className="text-gray-600 hover:text-gray-900 text-sm">Blog</a>
              </li> */}
              {/* <li>
                <a href="/community" className="text-gray-600 hover:text-gray-900">Community</a>
              </li>
              <li>
                <a href="/templates" className="text-gray-600 hover:text-gray-900">Templates</a>
              </li> */}
            </ul>
          </div>

          {/* Budgez For Links */}
          {/* <div className="col-span-1">
            <h3 className="font-medium text-gray-900 mb-4">Budgez per</h3>
            <ul className="space-y-3">
              <li>
                <a href="/enterprise" className="text-gray-600 hover:text-gray-900">Enterprise</a>
              </li>
              <li>
                <a href="/small-business" className="text-gray-600 hover:text-gray-900">Piccole imprese</a>
              </li>
              <li>
                <a href="/personal" className="text-gray-600 hover:text-gray-900">Uso personale</a>
              </li>
            </ul>
          </div> */}
        </div>

        {/* Bottom Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                Italiano
              </button>
              <a href="/privacy" className="text-gray-600 hover:text-gray-900" target="_blank" rel="noopener noreferrer">
                Privacy e termini
              </a>
            </div>
            <div className="text-gray-600">
              © 2025 Budgez è un brand di <a className='bg-yellow-200' href="https://larin.it/">Larin Srl</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;