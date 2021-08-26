import React from 'react';

const Formulario = () => {
    return (
        <>
            <form>
                <div className="input-field col s12">
                    <input
                        type="text"
                        name="ciudad"
                        id="ciudad"
                    />
                    <label>Ciudad: </label>
                </div>
            </form>
        </>
    );
}

export default Formulario;