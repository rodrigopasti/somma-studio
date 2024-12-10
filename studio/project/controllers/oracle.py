import boto3
import time
import oci


class OCI:
    def __init__(self, profile = "default"):

        if profile == "default":
            config = oci.config.from_file()
        else:
            config = oci.config.from_file(profile_name=profile)

        oci.config.validate_config(config)
        self._compartment_id = config["tenancy"]
        self._compute_client = oci.core.ComputeClient(config)
        self._network_client = oci.core.VirtualNetworkClient(config)


    def get_image_id(self, tenancy, display_name, version):

        for image in self._compute_client.list_images(tenancy).data:
            try:
                if image.display_name == display_name and version and image.freeform_tags["version"] == version:
                    return image.id
            except Exception as e:
                continue

    def create_instance(self, display_name, image_name, version, emp_user = "", machine = "VM.Standard.E2.1", region="tYgt:SA-SAOPAULO-1-AD-1", image_id = None):

        image_id = self.get_image_id(self._compartment_id, image_name, version) if not image_id else image_id

        instance = oci.core.models.LaunchInstanceDetails(compartment_id=self._compartment_id,
                                                         image_id=image_id,
                                                         availability_domain = region,
                                                         display_name = display_name,
                                                         shape = machine,
                                                         subnet_id="ocid1.subnet.oc1.sa-saopaulo-1.aaaaaaaa3ztdi6chxy6n4utm3brdrt52xw5veoebwdqeoslbsqeeyuazjwga",
                                                         defined_tags = {"Oracle-Tags": {"CreatedBy": emp_user}}
                                                         )
        machine = self._compute_client.launch_instance(instance).data

        return {"id" : machine.id, "compartment_id" : machine.compartment_id}

    def create_gpu_instance(self, display_name, image_name, version, emp_user = "", machine = "VM.GPU3.1", region="lldX:US-ASHBURN-AD-3", image_id = None):
        
        image_id = self.get_image_id(self._compartment_id, image_name, version) if not image_id else image_id

        instance = oci.core.models.LaunchInstanceDetails(compartment_id=self._compartment_id,
                                                         image_id=image_id,
                                                         availability_domain = region,
                                                         display_name = display_name,
                                                         shape = machine,
                                                         subnet_id="ocid1.subnet.oc1.iad.aaaaaaaa4d2afrcttkoiikykk4rqe5a7cp6dydjo4m3p27nu7tbrpzx766iq",
                                                         defined_tags = {"Oracle-Tags": {"CreatedBy": emp_user}}
                                                         )

        # se precisar subir maquina sem GPU mas com memória. Zerar a variavel params para "" no arquivo run_application (somente local apontando para online)
        '''instance = oci.core.models.LaunchInstanceDetails(compartment_id=self._compartment_id,
                                                         image_id=image_id,
                                                         availability_domain=region,
                                                         display_name=display_name,
                                                         shape="VM.Standard.E3.Flex",
                                                         shape_config={"ocpus": 36, "memory_in_gbs" : 256},
                                                         subnet_id="ocid1.subnet.oc1.iad.aaaaaaaa4d2afrcttkoiikykk4rqe5a7cp6dydjo4m3p27nu7tbrpzx766iq",
                                                         defined_tags={
                                                             "Oracle-Tags": {"CreatedBy": emp_user}}
                                                         )'''

        machine = self._compute_client.launch_instance(instance).data

        return {"id" : machine.id, "compartment_id" : machine.compartment_id}

    def get_machine_ip(self, machine_id, compartment_id):

        import time

        if self._compute_client.get_instance(machine_id).data.lifecycle_state != "RUNNING":
            return None

        vnic_id = self._compute_client.list_vnic_attachments(
                                        compartment_id=compartment_id,
                                        instance_id=machine_id
                                    ).data[0].vnic_id

        ip = self._network_client.get_vnic(vnic_id).data.public_ip

        return ip

    def terminate_instance(self, machine_id):
        self._compute_client.terminate_instance(machine_id)
        

    def check_state(self, vm_id):
        ec2_client = boto3.client('ec2')
        return ec2_client.describe_instances(InstanceIds=[vm_id])['Reservations'][0]['Instances'][0]['State']['Name']
