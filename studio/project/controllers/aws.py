import boto3
import time


class EC2:
    def __init__(self, SecurityGroups='CentOS 7 -x86_64- - with Updates HVM-1901_01-AutogenByAWSMP-1'):
        self.SecurityGroups = SecurityGroups

    def create_instance(self, image_id, instance_type, emp_user = ""):
        print(instance_type)
        if instance_type == "m4.4xlarge":
            size = 200
        else:
            size = 30


        ec2_resource = boto3.resource('ec2')
        vm_info = ec2_resource.create_instances(ImageId=image_id,
                                                MinCount=1, MaxCount=1,
                                                InstanceType=instance_type,
                                                SecurityGroups=[
                                                    self.SecurityGroups],
                                                BlockDeviceMappings=[{"DeviceName": "/dev/sda1", "Ebs": {"VolumeSize": size}}])
        vm_id = vm_info[0].__dict__['_id']
        ec2_resource.create_tags(Resources=[vm_id], Tags=[{'Key':'Name', 'Value': emp_user}])

        return {'id': vm_id, "compartment_id" : ""}

    def get_machine_ip(self, machine_id):
        ec2_client = boto3.client('ec2')
        vm_state = self.check_state(machine_id)
        
        if vm_state == 'pending':
            return None

        vm_ip = ec2_client.describe_instances(InstanceIds=[machine_id])[
            'Reservations'][0]['Instances'][0]['PublicIpAddress']
        return vm_ip

    def terminate_instance(self, vm_id):
        ec2_resource = boto3.resource('ec2')
        try:
            ec2_resource.instances.filter(InstanceIds=[vm_id]).terminate()
            return True
        except:
            return False

    def check_state(self, vm_id):
        ec2_client = boto3.client('ec2')
        return ec2_client.describe_instances(InstanceIds=[vm_id])['Reservations'][0]['Instances'][0]['State']['Name']
