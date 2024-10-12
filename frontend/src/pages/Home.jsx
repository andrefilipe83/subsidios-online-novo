import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import Spinner from '../components/Spinner';
import { Link } from 'react-router-dom';
import { AiOutlineEdit } from 'react-icons/ai';
import { BsInfoCircle } from 'react-icons/bs';
import { MdOutlineAddBox , MdOutlineDelete } from 'react-icons/md';

const Home = () => {
    const [socios, setSocios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get('http://localhost:5555/socios')
        .then((response) => {
            console.log(response.data.socios); // Ajustado para refletir a estrutura correta dos dados
            setSocios(response.data.socios);
            setLoading(false);
        })
        .catch((error) => {
            console.log(error);
            setLoading(false);
        });
    }, []);

    console.log(socios); // Adicionado para verificar o estado 'socios'

    return (
        <div className="p-4">
            <div className='flex justify-between items-center'>
                <h1 className='text-3xl my-8'>Socios</h1>
                <Link to='/socios/create'>
                    <MdOutlineAddBox  className='text-sky-800 text-4xl' />
                </Link>
            </div>
            {loading ? (
                <Spinner />
            ) : (
                <table className='w-full border-separate border-spacing'>
                    <thead>
                        <tr>
                            <th className='border border-gray-500'>ID</th>
                            <th className='border border-gray-500'>Nome</th>
                            <th className='border border-gray-500'>Email</th>
                            <th className='border border-gray-500'>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {socios.map((socio, index) => (
                            <tr key={socio._id} className='h-8'>
                                <td className='border border-gray-500'>{index + 1}</td>
                                <td className='border border-gray-500'>{socio.name}</td>
                                <td className='border border-gray-500'>{socio.email}</td>
                                <td className='border border-gray-500'>
                                    <Link to={`/socios/edit/${socio._id}`}>
                                        <AiOutlineEdit className='text-blue-500 text-xl' />
                                    </Link>
                                    <Link to={`/socios/show/${socio._id}`}>
                                        <BsInfoCircle className='text-green-500 text-xl' />
                                    </Link>
                                    <Link to={`/socios/delete/${socio._id}`}>
                                        <MdOutlineDelete className='text-red-500 text-xl' />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Home;


/*import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import Spinner from '../components/Spinner';
import { Link } from 'react-router-dom';
import { AiOutlineEdit } from 'react-icons/ai';
import {BsInfoCircle} from 'react-icons/bs';
import {MdOutlineAddbox, MdOutlineDelete} from 'react-icons/md';

export const Home = () => {
    const [socios, setSocios] = useState([]);
    const [loading, setLoading] = useState(true);
   useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:5555/socios')
    .then((response) => {
        setSocios(response.data.data);
        setLoading(false);
    })
    .catch((error) => {
        console.log(error);
        setLoading(false);
    });
    }, []);
    return (
        <div className="p-4">
            <div className='flex justify-between items-center'>
                <h1 className='text-3xl my-8'>Socios</h1>
                <Link to='/create-socio'>
                    <MdOutlineAddbox className=' text-sky-800 text-4xl' />
                </Link>
            </div>
            {loading ? (
                <Spinner />
            ) : (
                <table className='w-full border-separate border-spacing'>
                    <thead>
                        <tr>
                            <th className='border border-gray-500'>ID</th>
                            <th className='border border-gray-500'>Nome</th>
                            <th className='border border-gray-500'>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {socios.map((socio, index) => (
                            <tr key={socio._id} className ='h-8'>
                                <td className='border border-gray-500'>{index + 1}</td>
                                <td className='border border-gray-500'>{socio.nome}</td>
                                <td className='border border-gray-500'>{socio.email}</td>
                                <td className='border border-gray-500'>
                                    <Link to={`/edit-socio/${socio._id}`}>
                                        <AiOutlineEdit className='text-blue-500 text-xl' />
                                    </Link>
                                </td>
                                <td className='border border-gray-500'>
                                    <Link to={`/show-socio/${socio._id}`}>
                                        <BsInfoCircle className='text-green-500 text-xl' />
                                    </Link>
                                </td>
                                <td className='border border-gray-500'>
                                    <Link to={`/delete-socio/${socio._id}`}>
                                        <MdOutlineDelete className='text-red-500 text-xl' />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}*/


            
                               

