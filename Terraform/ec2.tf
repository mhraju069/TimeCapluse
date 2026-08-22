resource "aws_key_pair" "relic" {
  key_name   = var.aws_key_pair
  public_key = file("${path.module}/relic-key.pub")
}

resource "aws_instance" "relic" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = aws_key_pair.relic.key_name
  root_block_device {volume_size = var.volume_size}
  vpc_security_group_ids      = [aws_security_group.sg.id]
  subnet_id                   = var.subnet_id
  user_data                   = file("${path.module}/userdata.sh")
  user_data_replace_on_change = true

  tags = {
    Name        = var.instance_name
    Env = var.deployment_type 
  }
}