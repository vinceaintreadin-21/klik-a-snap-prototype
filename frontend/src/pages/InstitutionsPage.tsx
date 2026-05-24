import { useState } from 'react'
import InstitutionTable from '../components/institutions/InstitutionTable'
import CreateInstitutionModal from '../components/institutions/CreateInstitutionModal'
import SuspendInstitutionModal from '../components/institutions/SuspendInstitutionModal'
import ActivateInstitutionModal from '../components/institutions/ActivateInstitutionModal'
import { useInstitutions } from '../hooks/useInstitutions'

interface Institution {
    id: number
    name: string
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

type ModalType = 'create' | 'suspend' | 'activate' | null

const InstitutionsPage = () => {
    const { refetch } = useInstitutions()
    const [modal, setModal] = useState<ModalType>(null)
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)

    const openSuspend = (institution: Institution) => {
        setSelectedInstitution(institution)
        setModal('suspend')
    }

    const openActivate = (institution: Institution) => {
        setSelectedInstitution(institution)
        setModal('activate')
    }
    const closeModal = () => {
        setModal(null)
        setSelectedInstitution(null)
    }

    const handleSuccess = () => {
        refetch()
        closeModal()
    }

    return (
        <div className='p-6 max-w-7x1 mx-auto'>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all registered institutions and their access.</p>
            </div>

            <InstitutionTable
                onSuspend={openSuspend}
                onActivate={openActivate}
                onCreate={() => setModal('create')}
            />  
            
            {modal === 'create' && (
                <CreateInstitutionModal
                    onClose={closeModal}
                    onSuccess={handleSuccess}
                />
            )}

            {modal === 'suspend' && selectedInstitution && (
                <SuspendInstitutionModal
                    institution={selectedInstitution}
                    onClose={closeModal}
                    onSuccess={handleSuccess}
                />
            )}

            {modal === 'activate' && selectedInstitution && (
                <ActivateInstitutionModal
                    institution={selectedInstitution}
                    onClose={closeModal}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}

export default InstitutionsPage