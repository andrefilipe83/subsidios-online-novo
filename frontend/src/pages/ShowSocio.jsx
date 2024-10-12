import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';

const ShowSocio = () => {
    const [socio, setSocio] = useState({});
    const [loading, setLoading] = useState(false);
    const { id } = useParams();

    useEffect(() => {
        setLoading(true);
        axios.get(`http://localhost:5555/socios/${id}`)
        .then((response) => {
            setSocio(response.data);
            setLoading(false);
        })
        .catch((error) => {
            console.log(error);
            setLoading(false);
        });
    }, [id]);

    return (
        <div className="p-4">
            <BackButton />
            <h1 className="text-3xl my-4">Socio</h1>
            {loading ? (
                <Spinner />
            ) : (
                <div>
                    <p>Nome: {socio.name}</p> {/* Alterado para 'name' */}
                    <p>Email: {socio.email}</p>
                </div>
            )}
        </div>
    );
}

export default ShowSocio;



/*import React, { useEffect, useState } from 'react';
import axios from 'axios'
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { Spinner } from '../components/Spinner';

const ShowSocio = () => {
    const [socio, setSocio] = useState({});
    const [loading, setLoading] = useState(false);
    const { id } = useParams();

    useEffect(() => {
        setLoading(true);
        axios.get(`http://localhost:5555/socios/${id}`)
        .then((response) => {
            setSocio(response.data);
            setLoading(false);
        })
        .catch((error) => {
            console.log(error);
            setLoading(false);
        });
    }, []);

    return (
    <div className="p-4">
        <BackButton />
        <h1 className="text-3xl my-4">Socio</h1>
        {loading ? (
            <Spinner />
        ) : (
            <div>
                <p>Nome: {socio.nome}</p>
                <p>Email: {socio.email}</p>
            </div>
        )} 
    </div>
  )
}

export default ShowSocio
*/